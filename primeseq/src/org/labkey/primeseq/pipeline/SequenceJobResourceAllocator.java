package org.labkey.primeseq.pipeline;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.labkey.api.cluster.ClusterResourceAllocator;
import org.labkey.api.data.ConvertHelper;
import org.labkey.api.pipeline.PipelineJob;
import org.labkey.api.pipeline.RemoteExecutionEngine;
import org.labkey.api.pipeline.TaskId;
import org.labkey.api.reader.Readers;
import org.labkey.api.sequenceanalysis.pipeline.HasJobParams;
import org.labkey.api.sequenceanalysis.pipeline.PipelineStep;
import org.labkey.api.sequenceanalysis.pipeline.SequencePipelineService;
import org.labkey.api.util.FileUtil;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 *
 * Created by bbimber
 *
 */
public class SequenceJobResourceAllocator implements ClusterResourceAllocator
{
    public static class Factory implements ClusterResourceAllocator.Factory
    {
        @Override
        public ClusterResourceAllocator getAllocator()
        {
            return new SequenceJobResourceAllocator();
        }

        @Override
        public Integer getPriority(TaskId taskId)
        {
            return (taskId.getNamespaceClass() != null && (
                    taskId.getNamespaceClass().getName().startsWith("org.labkey.sequenceanalysis.pipeline")
            )) ? 50 : null;
        }
    }

    private boolean isSequenceNormalizationTask(PipelineJob job)
    {
        return (job.getActiveTaskId() != null && job.getActiveTaskId().getNamespaceClass().getName().endsWith("SequenceNormalizationTask"));
    }

    private boolean isSequenceAlignmentTask(PipelineJob job)
    {
        return (job.getActiveTaskId() != null && job.getActiveTaskId().getNamespaceClass().getName().endsWith("SequenceAlignmentTask"));
    }

    private boolean isCacheAlignerIndexesTask(PipelineJob job)
    {
        return (job.getActiveTaskId() != null && job.getActiveTaskId().getNamespaceClass().getName().endsWith("CacheAlignerIndexesTask"));
    }

    private boolean isSequenceSequenceOutputHandlerTask(PipelineJob job)
    {
        return (job.getActiveTaskId() != null && job.getActiveTaskId().getNamespaceClass().getName().endsWith("SequenceOutputHandlerRemoteTask"));
    }

    private Long _totalFileSize = null;
    private static final Long UNABLE_TO_DETERMINE = -1L;

    @Override
    public Integer getMaxRequestCpus(PipelineJob job)
    {
        if (job instanceof HasJobParams)
        {
            Map<String, String> params = ((HasJobParams)job).getJobParams();
            if (params.get("resourceSettings.resourceSettings.cpus") != null)
            {
                Integer cpus = ConvertHelper.convert(params.get("resourceSettings.resourceSettings.cpus"), Integer.class);
                job.getLogger().debug("using CPUs supplied by job: " + cpus);
                return cpus;
            }
        }

        if (isSequenceNormalizationTask(job))
        {
            job.getLogger().debug("setting max CPUs to 8");
            return 8;
        }

        Long totalFileSize = getFileSize(job);
        if (UNABLE_TO_DETERMINE.equals(totalFileSize))
        {
            return null;
        }

        if (isSequenceAlignmentTask(job))
        {
            //10gb
            if (totalFileSize < 10e9)
            {
                job.getLogger().debug("file size less than 10gb, lowering CPUs to 8");

                return 8;
            }
            else if (totalFileSize < 20e9)
            {
                job.getLogger().debug("file size less than 20gb, lowering CPUs to 16");

                return 16;
            }

            job.getLogger().debug("file size greater than 20gb, using 24 CPUs");

            return 24;
        }

        return null;
    }

    @Override
    public Integer getMaxRequestMemory(PipelineJob job)
    {
        Integer ret = null;
        if (job instanceof HasJobParams)
        {
            Map<String, String> params = ((HasJobParams) job).getJobParams();
            if (params.get("resourceSettings.resourceSettings.ram") != null)
            {
                Integer ram = ConvertHelper.convert(params.get("resourceSettings.resourceSettings.ram"), Integer.class);
                job.getLogger().debug("using RAM supplied by job: " + ram);
                ret = ram;
            }
        }

        if (isSequenceNormalizationTask(job))
        {
            job.getLogger().debug("setting memory to 24");
            return 24;
        }

        if (isCacheAlignerIndexesTask(job))
        {
            job.getLogger().debug("setting memory to 48");
            return 48;
        }

        Long totalFileSize = getFileSize(job);
        if (UNABLE_TO_DETERMINE.equals(totalFileSize))
        {
            return null;
        }

        boolean hasHaplotypeCaller = false;
        boolean hasStar = false;
        boolean hasBismark = false;
        boolean hasBowtie2 = false;

        if (isSequenceSequenceOutputHandlerTask(job))
        {
            File jobXml = new File(job.getLogFile().getParentFile(), FileUtil.getBaseName(job.getLogFile()) + ".job.json.txt");
            if (jobXml.exists())
            {
                try (BufferedReader reader = Readers.getReader(jobXml))
                {
                    String line;
                    while ((line = reader.readLine()) != null)
                    {
                        if (line.contains("HaplotypeCallerHandler"))
                        {
                            hasHaplotypeCaller = true;
                            break;
                        }
                    }
                }
                catch (IOException e)
                {
                    job.getLogger().error(e.getMessage(), e);
                }
            }
        }

        if (isSequenceAlignmentTask(job))
        {
            if (ret == null)
            {
                if (totalFileSize <= 30e9)
                {
                    job.getLogger().debug("file size less than 30gb, setting memory to 24");

                    ret = 24;
                }
                else
                {
                    job.getLogger().debug("file size greater than 30gb, setting memory to 48");

                    ret = 48;
                }
            }

            Map<String, String> params = job.getParameters();
            if (params != null)
            {
                if (params.containsKey(PipelineStep.StepType.analysis.name()) && params.get(PipelineStep.StepType.analysis.name()).contains("HaplotypeCallerAnalysis"))
                {
                    hasHaplotypeCaller = true;
                }

                if (params.containsKey(PipelineStep.StepType.alignment.name()) && params.get(PipelineStep.StepType.alignment.name()).contains("STAR"))
                {
                    hasStar = true;
                }

                if (params.containsKey(PipelineStep.StepType.alignment.name()) && params.get(PipelineStep.StepType.alignment.name()).contains("Bismark"))
                {
                    hasBismark = true;
                }

                if (params.containsKey(PipelineStep.StepType.alignment.name()) && params.get(PipelineStep.StepType.alignment.name()).contains("Bowtie2"))
                {
                    hasBowtie2 = true;
                }
            }
        }

        if (hasHaplotypeCaller)
        {
            Integer orig = ret;
            ret = ret == null ? 48 : Math.max(ret, 48);
            if (!ret.equals(orig))
            {
                job.getLogger().debug("adjusting RAM for HaplotypeCaller to: " + ret);
            }
        }

        if (hasStar)
        {
            Integer orig = ret;
            ret = ret == null ? 48 : Math.max(ret, 48);
            if (!ret.equals(orig))
            {
                job.getLogger().debug("adjusting RAM for STAR to: " + ret);
            }
        }

        if (hasBismark)
        {
            Integer orig = ret;
            ret = ret == null ? 48 : Math.max(ret, 48);
            if (!ret.equals(orig))
            {
                job.getLogger().debug("adjusting RAM for Bismark to: " + ret);
            }
        }

        if (hasBowtie2)
        {
            Integer orig = ret;
            ret = ret == null ? 48 : Math.max(ret, 48);
            if (!ret.equals(orig))
            {
                job.getLogger().debug("adjusting RAM for bowtie2 to: " + ret);
            }
        }

        return ret;
    }

    @Override
    public void addExtraSubmitScriptLines(PipelineJob job, RemoteExecutionEngine engine, List<String> lines)
    {
        if (job instanceof HasJobParams)
        {
            possiblyAddWeekLongLines(job, engine, lines);

            //possiblyAddHighIoFlag(job, engine, lines);
        }
        else
        {
            job.getLogger().error("This job type does not implement HasJobParams");
        }
    }

    private void removeExistingPartition(List<String> lines, boolean removeTime)
    {
        lines.removeIf(line -> line.contains("#SBATCH --qos="));

        if (removeTime)
        {
            lines.removeIf(line -> line.contains("#SBATCH --time="));
        }
    }

    private void possiblyAddWeekLongLines(PipelineJob job, RemoteExecutionEngine engine, List<String> lines)
    {
        Map<String, String> params = ((HasJobParams)job).getJobParams();
        if (params.get("resourceSettings.resourceSettings.weekLongJob") != null)
        {
            Boolean weekLongJob = ConvertHelper.convert(params.get("resourceSettings.resourceSettings.weekLongJob"), Boolean.class);
            if (weekLongJob)
            {
                job.getLogger().debug("adding WEEK_LONG_JOB as supplied by job");
                if (engine.getType().equals("HTCondorEngine"))
                {
                    lines.add("concurrency_limits = WEEK_LONG_JOBS");
                }
                else if (engine.getType().equals("SlurmEngine"))
                {
                    //exacloud: 36 hours
                    //long_jobs: 10 days (max 60 jobs currently)
                    //very_long_jobs: 30 days (suspends when node is busy)

                    //Note: consider supporting --time, which allows request of a shorter duration job

                    //first remove existing
                    removeExistingPartition(lines, true);

                    //then add
                    lines.add("#SBATCH --qos=long_jobs");
                    lines.add("#SBATCH --time=10-0");  //10 days
                }
            }
        }

        if (params.get("resourceSettings.resourceSettings.veryLongJob") != null)
        {
            Boolean weekLongJob = ConvertHelper.convert(params.get("resourceSettings.resourceSettings.veryLongJob"), Boolean.class);
            if (weekLongJob)
            {
                job.getLogger().debug("adding very_long_jobs as supplied by job");
                if (engine.getType().equals("SlurmEngine"))
                {
                    //first remove existing
                    removeExistingPartition(lines, true);

                    //then add
                    lines.add("#SBATCH --qos=very_long_jobs");
                    lines.add("#SBATCH --time=30-0");  //30 days
                }
            }
        }
    }

    private boolean jobProvidedCpusOrRam(PipelineJob job)
    {
        if (job instanceof HasJobParams)
        {
            Map<String, String> params = ((HasJobParams) job).getJobParams();
            if (StringUtils.trimToNull(params.get("resourceSettings.resourceSettings.cpus")) != null)
            {
                return true;
            }
            else if (StringUtils.trimToNull(params.get("resourceSettings.resourceSettings.ram")) != null)
            {
                return true;
            }
        }

        return false;
    }

//    private boolean getHighIOValue(PipelineJob job)
//    {
//        Map<String, String> params = ((HasJobParams) job).getJobParams();
//        if (params.get("resourceSettings.resourceSettings.highio") != null)
//        {
//            return ConvertHelper.convert(params.get("resourceSettings.resourceSettings.highio"), Boolean.class);
//        }
//
//        return false;
//    }
//
//    private void possiblyAddHighIoFlag(PipelineJob job, RemoteExecutionEngine engine, List<String> lines)
//    {
//        if (job instanceof HasJobParams)
//        {
//            boolean highio = getHighIOValue(job);
//            if (highio)
//            {
//                job.getLogger().debug("adding highio as supplied by job");
//                if (engine.getType().equals("HTCondorEngine"))
//                {
//                    lines.add("concurrency_limits = highio");
//                    return;
//                }
//                else if (engine.getType().equals("SlurmEngine"))
//                {
//                    removeExistingPartition(lines, false);
//
//                    lines.add("#SBATCH --partition=highio");
//                }
//                else
//                {
//                    job.getLogger().debug("HighIO was selected, but it is not supported on this cluster type: " + engine.getType());
//                }
//            }
//        }
//    }

    private Long getFileSize(PipelineJob job)
    {
        if (_totalFileSize != null)
        {
            return _totalFileSize;
        }

        List<File> files = SequencePipelineService.get().getSequenceJobInputFiles(job);
        if (files != null && !files.isEmpty())
        {
            long total = 0;
            for (File f : files)
            {
                if (f.exists())
                {
                    total += f.length();
                }
            }

            job.getLogger().info("total input files: " + files.size());
            job.getLogger().info("total size of input files: " + FileUtils.byteCountToDisplaySize(total));

            _totalFileSize = total;
        }
        else
        {
            _totalFileSize = UNABLE_TO_DETERMINE;
        }

        return _totalFileSize;
    }

    @Override
    public void processJavaOpts(PipelineJob job, RemoteExecutionEngine engine, @NotNull List<String> existingJavaOpts)
    {
        if (job instanceof HasJobParams)
        {
            Map<String, String> params = ((HasJobParams) job).getJobParams();
            if (params.get("resourceSettings.resourceSettings.javaProcessXmx") != null && !StringUtils.isEmpty(params.get("resourceSettings.resourceSettings.javaProcessXmx")))
            {
                Integer xmx = ConvertHelper.convert(params.get("resourceSettings.resourceSettings.javaProcessXmx"), Integer.class);
                if (xmx != null)
                {
                    job.getLogger().debug("using java process -xmx supplied by job: " + xmx);
                    existingJavaOpts.removeIf(x -> x.startsWith("-Xmx"));

                    existingJavaOpts.add("-Xmx" + xmx + "g");
                }
            }
        }
    }
}